package com.cmb.bus.product.operation;

import java.sql.Connection;
import java.sql.Date;
import java.util.HashMap;
import java.util.Map;

import com.cmb.bus.common.util.Branch;
import com.cmb.bus.common.util.Parameter;
import com.cmb.bus.product.util.Product;
import com.cmb.bus.resource.util.FileUtil;
import com.frm.base.exception.FrameworkException;
import com.frm.base.model.ICacheTable;
import com.frm.base.util.DateUtil;
import com.frm.base.util.StringUtil;
import com.frm.container.context.IContext;
import com.frm.container.operation.IOperation;
import com.frm.dao.model.imp.DBSql;
import com.frm.dao.model.imp.DBTable;

/***
 * 查询产品明细   
 * 输入:产品编码(多个,分开) 
 * 或有输入：版本日期,是否更新查询次数
 * @author 80374419
 * 
 */
public class Detail implements IOperation {
	public static final String DetailX1 = "DetailX1";
	public static final String DetailZ1 = "DetailZ1";
    
	@Override
	public int execute(IContext context) throws FrameworkException {		
		
		ICacheTable input = context.getInputData().get(DetailX1);
		if (input == null || input.getRecordCount() < 1){
			context.setErrorMessage("输入参数不存在");
			return -1;
		}
		
		String iPrdCd = input.getSqlString(0, "PRD_CD").trim();
		String iPrdCds = "";
		String[] prdcdArr = iPrdCd.split(",");
		for (int i = 0; i < prdcdArr.length; i++) {
			if (i > 0) {
				iPrdCds += ",";
			}
			iPrdCds += "'" + prdcdArr[i] + "'";
		}
		
		Date updDte = null;
		if (input.getFieldList().contains("UPD_DTE")) {
			updDte = input.getDate(0, "UPD_DTE");
			if (java.sql.Date.valueOf("1900-01-01").equals(updDte)) {
				updDte = null;
			}
		}
		
		boolean updateQueryCount = false;
		if (input.getFieldList().contains("UPDATE_QUERY_COUNT")) {
			updateQueryCount = input.getBoolean(0, "UPDATE_QUERY_COUNT");
		}
		
		String iPrdSts = "";
		if (input.getFieldList().contains("PRD_STS")) {
			iPrdSts = input.getSqlString(0, "PRD_STS");
		}
		
		// 先查询当前表
		Connection conn = context.getConnection();

		String sql = "SELECT * FROM PRD.PRODUCT WHERE PRD_CD IN (" + iPrdCds + ") ";
		if (!StringUtil.isEmpty(iPrdSts)) {
			sql += "AND PRD_STS='" + iPrdSts + "' ";
		}
		ICacheTable prdCache = new DBTable(conn, DetailZ1, sql).select();
		
		// 更新日期不为空,且输入更新日期小于查询结果产品更新日期时(java.sql.Date.valueOf()) 查询历史表数据 
		if (prdCache.getRecordCount() > 0 && updDte != null && updDte.before(DateUtil.rollDay(DateUtil.getCurrentDate(), -1))) {
			Map<String, Integer> curPrdLoc = new HashMap<String, Integer>();
			for(int curLoc = 0; curLoc < prdCache.getRecordCount(); curLoc++){
				curPrdLoc.put(prdCache.getString(curLoc, "PRD_CD"), curLoc);
			}
			
			// 查询历史表
			String sqlHis = "SELECT * FROM PRD.PRODUCT_HIS WHERE PRD_CD IN (" + iPrdCds + ") AND ?>=STR_DTE AND ?<END_DTE";
			ICacheTable prdCacheHis = new DBTable(conn, "HIS", sqlHis, updDte, updDte).select();

			for(int hisLoc = 0; hisLoc < prdCacheHis.getRecordCount(); hisLoc++){
				Integer updateLoc = curPrdLoc.get(prdCacheHis.get(0, "PRD_CD"));
				if(updateLoc == null){
					continue;
				}
				
				prdCache.update(updateLoc, "MAS_CD", prdCacheHis.get(hisLoc, "MAS_CD"));
				prdCache.update(updateLoc, "CRG_CD", prdCacheHis.get(hisLoc, "CRG_CD"));
				prdCache.update(updateLoc, "FUND_ND", prdCacheHis.get(hisLoc, "FUND_ND"));
				prdCache.update(updateLoc, "PRD_NAM", prdCacheHis.get(hisLoc, "PRD_NAM"));
				prdCache.update(updateLoc, "UPP_PRD", prdCacheHis.get(hisLoc, "UPP_PRD"));
				prdCache.update(updateLoc, "PRD_LVL", prdCacheHis.get(hisLoc, "PRD_LVL"));
				prdCache.update(updateLoc, "PRD_STS", prdCacheHis.get(hisLoc, "PRD_STS"));
				prdCache.update(updateLoc, "BRN_NBR", prdCacheHis.get(hisLoc, "BRN_NBR"));
				prdCache.update(updateLoc, "ROOM", prdCacheHis.get(hisLoc, "ROOM"));
				prdCache.update(updateLoc, "HEAD_SAP", prdCacheHis.get(hisLoc, "HEAD_SAP"));
				prdCache.update(updateLoc, "SUB_SAP", prdCacheHis.get(hisLoc, "SUB_SAP"));
				prdCache.update(updateLoc, "UPD_DTE", prdCacheHis.get(hisLoc, "STR_DTE"));
			}
		}		 
		
		//详细信息		
		prdCache.addField("PRD_LV1_NAM");
		prdCache.addField("PRD_LV2_NAM");
		prdCache.addField("PRD_LV3_NAM");
		prdCache.addField("PRD_STS_NAM");
		prdCache.addField("BRN_NAM");
		prdCache.addField("IS_DEC_NAM");
		prdCache.addField("IS_HDWK_NAM");
		// 附件信息		
		prdCache.addField("MKT_FILE_NAM");
		prdCache.addField("OPR_FILE_NAM");
		prdCache.addField("MNL_FILE_NAM");
		prdCache.addField("MNG_FILE_NAM");
		prdCache.addField("FAB_FILE_NAM");
		prdCache.addField("OTR_FILE_NAM");// 其他文件
		prdCache.addField("EVL_FILE_NAM");
		prdCache.addField("RET_FILE_NAM");
		
		for(int curLoc = 0; curLoc < prdCache.getRecordCount(); curLoc++){
			String _brnNbr = prdCache.getString(curLoc, "BRN_NBR");
			String _prdSts = prdCache.getString(curLoc, "PRD_STS");
			String _isDec = prdCache.getString(curLoc, "IS_DEC");
			String _isHdwk = prdCache.getString(curLoc, "IS_HDWK");

			String _prdLv1 = prdCache.getString(curLoc, "PRD_LV1");
			String _prdLv2 = prdCache.getString(curLoc, "PRD_LV2");
			String _prdLv3 = prdCache.getString(curLoc, "PRD_LV3");

			prdCache.update(curLoc, "PRD_LV1_NAM", Product.getName(_prdLv1));
			prdCache.update(curLoc, "PRD_LV2_NAM", Product.getName(_prdLv2));
			prdCache.update(curLoc, "PRD_LV3_NAM", Product.getName(_prdLv3));
			prdCache.update(curLoc, "BRN_NAM", Branch.getName(Product.BranchCacheTable, _brnNbr));
			prdCache.update(curLoc, "PRD_STS_NAM", Parameter.getName("PRDSTS", _prdSts));
			prdCache.update(curLoc, "IS_DEC_NAM", Parameter.getName("YORN", _isDec));
			
			String isHdwkNam = "";
			if (StringUtil.isEmpty(_isHdwk)) {
				isHdwkNam = "无";
			} else {
				String[] isHdwkArr = _isHdwk.split(",");
				for (String hdwk : isHdwkArr) {
					isHdwkNam += Parameter.getName("HANDWORK", hdwk);
					isHdwkNam += ",";
				}
				isHdwkNam = isHdwkNam.substring(0, isHdwkNam.length() - 1);
			}
			prdCache.update(curLoc, "IS_HDWK_NAM", isHdwkNam);
			 
			
			prdCache.update(curLoc, "MKT_FILE_NAM", FileUtil.getFileName(context, prdCache.getString(curLoc, "MKT_FILE")));
			prdCache.update(curLoc, "OPR_FILE_NAM", FileUtil.getFileName(context, prdCache.getString(curLoc, "OPR_FILE")));
			prdCache.update(curLoc, "MNL_FILE_NAM", FileUtil.getFileName(context, prdCache.getString(curLoc, "MNL_FILE")));
			prdCache.update(curLoc, "MNG_FILE_NAM", FileUtil.getFileName(context, prdCache.getString(curLoc, "MNG_FILE")));
			prdCache.update(curLoc, "FAB_FILE_NAM", FileUtil.getFileName(context, prdCache.getString(curLoc, "FAB_FILE")));	
			prdCache.update(curLoc, "EVL_FILE_NAM", FileUtil.getFileName(context, prdCache.getString(curLoc, "EVL_FILE")));
			prdCache.update(curLoc, "RET_FILE_NAM", FileUtil.getFileName(context, prdCache.getString(curLoc, "RET_FILE")));
			
			String _oprFiled = prdCache.getString(curLoc, "OTR_FILE");
			String[] _oprFiledArr = _oprFiled.split(";");
			String _oprFileName = "";
			for (int oi = 0; oi < _oprFiledArr.length; oi++) {
				if (oi > 0) {
					_oprFileName = _oprFileName + ";";
				}
				_oprFileName = _oprFileName + FileUtil.getFileName(context, _oprFiledArr[oi]);
			}
			prdCache.update(curLoc, "OTR_FILE_NAM", _oprFileName);
		}
		
		// 单个查询时,返回产品简介
		if (prdCache.getRecordCount() == 1) {
			String cpjjString = "";
			ICacheTable cpjjCT = new DBTable(conn, "PRD.PRODUCT_HB",
					"SELECT CONTENT FROM PRD.PRODUCT_HB WHERE TYPE='CPJJ' AND PRD_CD=?",
					prdCache.getString(0, "PRD_CD")).select();
			if (cpjjCT != null && cpjjCT.getRecordCount() > 0) {
				cpjjString = cpjjCT.getString(0, "CONTENT");
			}

			prdCache.addField("CPJJ");
			prdCache.update(0, "CPJJ", cpjjString);
		}
	
		// 累计查询次数
		if(updateQueryCount){
			new DBSql(context.getConnection(), 
					"UPDATE PRD.PRODUCT SET QRY_CNT = VALUE(QRY_CNT,0) + 1 WHERE PRD_CD IN (" + iPrdCds + ")").execute();	
		}

		context.addOutputData(prdCache);		
		return 0;
	}
}
