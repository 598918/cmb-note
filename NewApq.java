package com.cmb.bus.product.operation;

import java.sql.Connection;

import com.cmb.bus.common.util.Branch;
import com.cmb.bus.common.util.Parameter;
import com.cmb.bus.product.util.Product;
import com.cmb.bus.resource.util.FileUtil;
import com.frm.base.exception.FrameworkException;
import com.frm.base.model.ICacheTable;
import com.frm.base.util.StringUtil;
import com.frm.container.context.IContext;
import com.frm.container.operation.IOperation;
import com.frm.dao.model.imp.DBTable;

/**
 * 查询流程中间表--新增产品
 * 输入：sessionID
 * 输出：更改后数据 Z1基本信息 Z2 Z3 Z4 产品手册 （新增无更改前数据)
 * 
 */
public class NewApq implements IOperation {
	public static final String NewApqX1 = "NewApqX1";
	public static final String NewApqZ1 = "NewApqZ1";
	public static final String NewApqZ2 = "NewApqZ2";
	public static final String NewApqZ3 = "NewApqZ3";
	public static final String NewApqZ4 = "NewApqZ4";
	
	
	@Override
	public int execute(IContext context) throws FrameworkException {			
		ICacheTable input = context.getInputData().get(NewApqX1);
		if (input == null || input.getRecordCount() < 1) {
			context.setErrorMessage("输入参数不存在");
			return -1;
		}
		
		int sessionId = input.getInteger(0, "SESSION_ID");		
		Connection conn = context.getConnection();		
		
		ICacheTable cacheTableZ1 = new DBTable(conn, NewApqZ1,
				"SELECT * FROM PRDWFL.PRODUCT_MS WHERE SESSION_ID =?", sessionId).select();		
		if(null == cacheTableZ1 || cacheTableZ1.getRecordCount() < 1){
			context.setErrorMessage("会话不存在或数据已失效");
			return -1;
		}
		
		// 更新基本信息字段	
		cacheTableZ1.addField("PRD_LV1_NAM");
		cacheTableZ1.addField("PRD_LV2_NAM");
		cacheTableZ1.addField("PRD_LV3_NAM");
		cacheTableZ1.addField("PRD_STS_NAM");
		cacheTableZ1.addField("BRN_NAM");
		cacheTableZ1.addField("IS_DEC_NAM");
		cacheTableZ1.addField("MKT_FILE_NAM");
		cacheTableZ1.addField("FAB_FILE_NAM");
		cacheTableZ1.addField("IS_HDWK_NAM");
		cacheTableZ1.addField("OTR_FILE_NAM");
		cacheTableZ1.addField("EVD_FILE_NAM");

		int curLoc = 0;		
		cacheTableZ1.update(curLoc, "PRD_LV1_NAM", Product.getName(cacheTableZ1.getString(curLoc, "PRD_LV1")));
		cacheTableZ1.update(curLoc, "PRD_LV2_NAM", Product.getName(cacheTableZ1.getString(curLoc, "PRD_LV2")));
		cacheTableZ1.update(curLoc, "PRD_LV3_NAM", Product.getName(cacheTableZ1.getString(curLoc, "PRD_LV3")));
		cacheTableZ1.update(curLoc, "PRD_STS_NAM", Parameter.getName("PRDSTS", cacheTableZ1.getString(curLoc, "PRD_STS")));
		cacheTableZ1.update(curLoc, "BRN_NAM", Branch.getName(Product.BranchCacheTable,  cacheTableZ1.getString(curLoc, "BRN_NBR")));
		cacheTableZ1.update(curLoc, "IS_DEC_NAM", Parameter.getName("YORN", cacheTableZ1.getString(curLoc, "IS_DEC")));
		cacheTableZ1.update(curLoc, "MKT_FILE_NAM",	FileUtil.getFileName(context, cacheTableZ1.getString(curLoc, "MKT_FILE")));
		cacheTableZ1.update(curLoc, "FAB_FILE_NAM",	FileUtil.getFileName(context, cacheTableZ1.getString(curLoc, "FAB_FILE")));
		
		String _isHdwk = cacheTableZ1.getString(curLoc, "IS_HDWK");
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
		cacheTableZ1.update(curLoc, "IS_HDWK_NAM", isHdwkNam);

		String _oprFiled = cacheTableZ1.getString(curLoc, "OTR_FILE");
		String[] _oprFiledArr = _oprFiled.split(";");
		String _oprFileName = "";
		for (int oi = 0; oi < _oprFiledArr.length; oi++) {
			if (oi > 0) {
				_oprFileName = _oprFileName + ";";
			}
			_oprFileName = _oprFileName + FileUtil.getFileName(context, _oprFiledArr[oi]);
		}
		cacheTableZ1.update(curLoc, "OTR_FILE_NAM", _oprFileName);

		String _evdFiled = cacheTableZ1.getString(curLoc, "EVD_FILE");
		String[] _evdFiledArr = _evdFiled.split(";");
		String _evdFileName = "";
		for (int ei = 0; ei < _evdFiledArr.length; ei++) {
			if (ei > 0) {
				_evdFileName = _evdFileName + ";";
			}
			_evdFileName = _evdFileName + FileUtil.getFileName(context, _evdFiledArr[ei]);
		}
		cacheTableZ1.update(curLoc, "EVD_FILE_NAM", _evdFileName);
		
		ICacheTable cacheTableZ2 = new DBTable(conn, NewApqZ2,
				"SELECT * FROM PRDWFL.PRODUCT_HB WHERE SESSION_ID =?", sessionId).select();
		cacheTableZ2.addField("FILE_NAM");
		for (int i = 0; i < cacheTableZ2.getRecordCount(); i++) {
			String file = cacheTableZ2.getString(i, "FILE");
			String fileName = "";
			if (!StringUtil.isEmpty(file)) {
				// 只支持一张图片
				fileName = FileUtil.getFileName(context, file);
			}
			cacheTableZ2.update(i, "FILE_NAM", fileName);
		}
	
		ICacheTable cacheTableZ3 = new DBTable(conn, NewApqZ3,
				"SELECT * FROM PRDWFL.PRODUCT_HB_RCGL WHERE SESSION_ID =? ORDER BY LIST_ORDER", sessionId).select();

		ICacheTable cacheTableZ4 = new DBTable(conn, NewApqZ4,
				"SELECT * FROM PRDWFL.PRODUCT_HB_XGZD WHERE SESSION_ID =? ORDER BY LIST_ORDER", sessionId).select();
		
		context.addOutputData(cacheTableZ1);
		context.addOutputData(cacheTableZ2);
		context.addOutputData(cacheTableZ3);
		context.addOutputData(cacheTableZ4);

		return 0;
	}
}
