package com.cmb.bus.buswap.arrange;

import java.sql.Connection;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.cmb.bus.buswap.base.Branch;
import com.cmb.bus.buswap.base.CommonUtil;
import com.cmb.bus.buswap.base.Permission;
import com.frm.base.exception.FrameworkException;
import com.frm.base.model.ICacheTable;
import com.frm.base.model.imp.CacheTable;
import com.frm.base.util.StringUtil;
import com.frm.container.context.IContext;
import com.frm.container.operation.IOperation;
import com.frm.dao.model.IDBTable;
import com.frm.dao.model.imp.DBTable;

/**
 * 查询管理班表清单 SCH.Q2RSLIST 班表清单表
 * 输入：
 * 		GRP_NBR 机构编号
 *      SCH_MON 排班月份
 * 输出：
 *      SCH_NBR 班表编号
 *      GRP_NBR 排班组
 *      GRP_NAM 排班组名称
 *      BBK_NBR 所属分行
 *      BBK_NAM 所属分行名称
 *		SCH_MON 排班月份
 *	   	STR_DTE 开始日期
 *	 	SCH_MDL 排班模型
 *	 	SCH_TYP 排班类型
 *	 	SCH_STS 排班状态
 *	 	CRT_USR 创建人
 *	 	CRT_TIM 创建时间
 *	 	UPD_USR 维护人
 *	 	UPD_TIM 维护时间
 *
 */
public class WapArrMngList implements IOperation {
	@Override
	public int execute(IContext context) throws FrameworkException {

		ICacheTable input = context.getInputData().get("InputParameter");
		if (input == null || input.getRecordCount() < 1) {
			throw new FrameworkException("000", "输入参数不存在");
		}
	
		String brnNbr = input.getSqlString(0, "BRN_NBR");	// 机构编号 
		String schMon = input.getSqlString(0, "SCH_MON");	// 排班月份

		//未传入机构，自动获取第一个权限机构
		if(StringUtil.isEmpty(brnNbr)){
			List<String> perBrn = Permission.getPermissionBranch(context);
			if(!perBrn.isEmpty()){
				brnNbr = perBrn.get(0);
			}else{
				context.setErrorMessage("无权执行接口" + context.getOperationID());
				return -1;
			}
		}else{
			if (!Permission.checkPermission(context, brnNbr)) {
				context.setErrorMessage("无权查询机构" + brnNbr);
				return -1;
			}
		}
		
		String sql = "SELECT SCH_NBR,GRP_NBR,SCH_MON,SCH_MDL,CRT_USR,CRT_TIM,UPD_USR,UPD_TIM " +
				"FROM SCH.Q2RSLIST WHERE SCH_STS='P' AND SCH_MON='" + schMon + "'";
		
		//获取 参数机构的所有下级机构及自身, 如果是总行100，则 获取所有机构数据
		if (!Branch.CMBCORNBR.equals(brnNbr) ) {
			Set<String> grpSet = new HashSet<String>();
			
			//如果为支行时，查出其所属排班组再查询
			if(Branch.isBrnNbr(brnNbr)){
				String brnGrpNbr = Branch.getGroup(brnNbr);
				if (StringUtil.isEmpty(brnGrpNbr)) {
					context.setErrorMessage("支行" + brnNbr + "未纳入排班组，无班表");
					return -1;
				}
				grpSet.add(brnGrpNbr);
			}
			
			//如果为分行，查询出下属排班组
			if(Branch.isBbkNbr(brnNbr)){
				grpSet = Branch.getGrpListByBbkAll(brnNbr);
			}
			
			if(Branch.isGroup(brnNbr) && Branch.existBranch(brnNbr)){
				grpSet.add(brnNbr);
			}
			
			if (grpSet.size() == 0 || grpSet.size() > 5000) {
				context.setErrorMessage("请按分行或排班组查询");
				return -1;
			}
			
			sql += " AND GRP_NBR IN (" + CommonUtil.changeSet2String(grpSet) + ")";
		}
		
		// 查询班表基本信息，获取排班组编号、排班月份
		Connection conn = context.getConnection();
		IDBTable dbTable = new DBTable(conn, "SCH.Q2RSLIST", sql);

		// 设置分页条件
		int dwnStr = input.getInteger(0, "DWN_STR");
		int dwnCnt = input.getInteger(0, "DWN_CNT");
		int pageNo = (dwnStr - 1) / dwnCnt + 1;
		dbTable.setPage(dwnCnt, "SCH_NBR DESC");
		ICacheTable resultTable = dbTable.select(pageNo);

		List<String> usrNbrList = new ArrayList<String>();
		int recordCount = resultTable.getRecordCount();
		for (int i = 0; i < recordCount; i++) {
			String tmpCrtUsr = resultTable.getString(i, "CRT_USR");
			String tmpUpdUsr = resultTable.getString(i, "UPD_USR");
			if(!usrNbrList.contains(tmpCrtUsr)){
				usrNbrList.add(tmpCrtUsr);
			}
			if(!usrNbrList.contains(tmpUpdUsr)){
				usrNbrList.add(tmpUpdUsr);
			}
		}
		Map<String, String> usrNamMap = Permission.getUserName(context, usrNbrList);

		resultTable.addField("GRP_NAM");
		resultTable.addField("CRT_USR_NAM");
		resultTable.addField("UPD_USR_NAM");
		resultTable.addField("BBK_NBR");
		resultTable.addField("BBK_NAM");
		for (int i = 0; i < recordCount; i++) {
			resultTable.update(i, "CRT_USR_NAM", usrNamMap.get(resultTable.getString(i, "CRT_USR")));
			resultTable.update(i, "UPD_USR_NAM", usrNamMap.get(resultTable.getString(i, "UPD_USR")));
			
			String _grpNbr = resultTable.getString(i, "GRP_NBR");
			String _bbkNbr = Branch.getGroupBbk(_grpNbr);
			String _grpNam = Branch.getName(_grpNbr);
			String _bbkNam = Branch.getName(_bbkNbr);

			resultTable.update(i, "BBK_NBR", _bbkNbr);
			// 去除排班组名称后缀
			if (_grpNam.endsWith("排班组")) {
				_grpNam = _grpNam.substring(0, _grpNam.length() - 3);
			}
			// 去除分行名称后缀
			if (_bbkNam.endsWith("分行")) {
				_bbkNam = _bbkNam.substring(0, _bbkNam.length() - 2);
			}
			resultTable.update(i, "GRP_NAM", _grpNam);
			resultTable.update(i, "BBK_NAM", _bbkNam);
		}

		// 返回分页总条数
		ICacheTable countTable = new CacheTable("counttable", "RCD_CNT");
		countTable.insert(dbTable.getRecordCount());

		Map<String, ICacheTable> output = new HashMap<String, ICacheTable>();
		output.put("OutputResult", resultTable);
		output.put("OutputResultCount", countTable);

		context.setOutputData(output);
		
		return 0;
	}

}
